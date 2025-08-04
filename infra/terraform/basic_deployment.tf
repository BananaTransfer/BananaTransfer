locals {
  app = "bananatransfer"
}

variable "environment_name" {
  description = "Will be used to generate the resource name. Only use char and underscore"
  type = string
}

variable "hostname" {
  description = "The domain hosted on AWS Route53 that will redirect traffic to the server instance"
  type = string
}

variable "ssh_pub_key" {
  description = "Public key deployed on the host to allow SSH connection"
  type = string
}

terraform {
  backend "s3" {
    bucket = "bananatransfer-terraform-deployment-state"
    region = "eu-west-1"
  }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }
}

provider "aws" {
  region = "eu-west-1"
  default_tags {
      tags = {
          project = local.app
          environment = var.environment_name
      }
  }
}

# firewall configuration

data "aws_vpc" "default" {
  default = true
}

resource "aws_security_group" "server_sg" {
  name        = "${local.app}_${var.environment_name}_server_sg"
  vpc_id      = data.aws_vpc.default.id
}

resource "aws_vpc_security_group_egress_rule" "server_sg_allow_all_egress_traffic_ipv4" {
  security_group_id = aws_security_group.server_sg.id
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "-1"
}

resource "aws_vpc_security_group_egress_rule" "server_sg_allow_all_egress_traffic_ipv6" {
  security_group_id = aws_security_group.server_sg.id
  cidr_ipv6         = "::/0"
  ip_protocol       = "-1"
}

resource "aws_vpc_security_group_ingress_rule" "server_sg_allow_https_ipv4" {
  security_group_id = aws_security_group.server_sg.id
  cidr_ipv4         = "0.0.0.0/0"
  from_port         = 443
  ip_protocol       = "tcp"
  to_port           = 443
}

resource "aws_vpc_security_group_ingress_rule" "server_sg_allow_http_ipv4" {
  security_group_id = aws_security_group.server_sg.id
  cidr_ipv4         = "0.0.0.0/0"
  from_port         = 80
  ip_protocol       = "tcp"
  to_port           = 80
}

resource "aws_vpc_security_group_ingress_rule" "server_sg_allow_ssh_ipv4" {
  security_group_id = aws_security_group.server_sg.id
  cidr_ipv4         = "0.0.0.0/0"
  from_port         = 22
  ip_protocol       = "tcp"
  to_port           = 22
}


# Provision S3 bucket

resource "aws_s3_bucket" "s3_bucket" {
  bucket = "${local.app}-${var.environment_name}-s3-bucket"
  force_destroy = true
}

# Create IAM role with S3 bucket access for EC2 instance

## Policy to allow EC2 server to assume the S3 role
data "aws_iam_policy_document" "ec2_policy_assume_s3_role" {
  statement {
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }

    actions = ["sts:AssumeRole"]
  }
}

## Create the role for S3 access
resource "aws_iam_role" "s3_access_role" {
  name               = "${local.app}_${var.environment_name}_s3_access_role"
  assume_role_policy = data.aws_iam_policy_document.ec2_policy_assume_s3_role.json
}


## Policy document that configure the S3 access
data "aws_iam_policy_document" "s3_access_policy" {
  statement {
    effect = "Allow"
    actions = [
      "s3:*"
    ]

    resources = [
      aws_s3_bucket.s3_bucket.arn,
      "${aws_s3_bucket.s3_bucket.arn}/*",
    ]
  }
}

resource "aws_iam_policy" "s3_access_policy" {
  name               = "${local.app}_${var.environment_name}_s3_access_policy"
  policy = data.aws_iam_policy_document.s3_access_policy.json
}

## Attach the S3 access policy to the role
resource "aws_iam_role_policy_attachment" "s3_access_policy_role_attachement" {
  role = aws_iam_role.s3_access_role.name
  policy_arn = aws_iam_policy.s3_access_policy.arn
}

resource "aws_iam_instance_profile" "s3_instance_profile" {
  name = "${local.app}_${var.environment_name}_s3_instance_profile"
  role = aws_iam_role.s3_access_role.name
}

# EC2 instance configuration

resource "aws_key_pair" "server_ssh_key" {
  key_name = "${local.app}_${var.environment_name}_server_ssh_key"
  public_key = var.ssh_pub_key
}

resource "aws_instance" "server" {
  instance_type = "t3a.nano"
  ami = "ami-0fbb72557598f5284" # debian 12
  vpc_security_group_ids = [aws_security_group.server_sg.id]
  key_name = aws_key_pair.server_ssh_key.key_name
  associate_public_ip_address = true
  iam_instance_profile = aws_iam_instance_profile.s3_instance_profile.name

  tags = {
    Name = "${local.app}_${var.environment_name}_server"
  }

  root_block_device {
    delete_on_termination = true
    volume_size = 20
    volume_type = "gp3"
  }
}

# domain redirection

data "aws_route53_zone" "domain" {
  name = "ansermoz.dev"
}

resource "aws_route53_record" "bananatransfer_subdomain" {
  zone_id = data.aws_route53_zone.domain.zone_id
  name    = var.hostname
  type    = "A"
  ttl     = 300
  records = [aws_instance.server.public_ip]
}

locals {
  app = "bananatransfer"
}

variable "environment_name" {
  description = "Will be used to generate the resource name. Only use char and underscore"
  type = string
}

variable "domain" {
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
  name    = var.domain
  type    = "A"
  ttl     = 300
  records = [aws_instance.server.public_ip]
}

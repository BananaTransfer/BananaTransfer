locals {
  region = "ew-west-1"
  app = "bananatransfer"
}

variable "environment_name" {
  description = "Will be used to generate the resource name. Only use char and underscore"
  type = string
  default = "staging"
}

variable "ssh_pub_key" {
  description = "Public key deployed on the host to allow SSH connection"
  type = string
}

terraform {
  backend "s3" {
    bucket = "bananatransfer-deployment-state"
    key    = "staging"
    region = local.region
  }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }
}

provider "aws" {
  region = local.region
  default_tags {
    project = local.app
  }
}

# firewall configuration

data "aws_vpc" "default" {
  default = true
}

resource "aws_security_group" "server_sg" {
  name        = "server_sg"
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
  cidr_ipv4         = data.aws_vpc.default.cidr_block
  from_port         = 443
  ip_protocol       = "tcp"
  to_port           = 443
}

resource "aws_vpc_security_group_ingress_rule" "server_sg_allow_http_ipv4" {
  security_group_id = aws_security_group.server_sg.id
  cidr_ipv4         = data.aws_vpc.default.cidr_block
  from_port         = 80
  ip_protocol       = "tcp"
  to_port           = 80
}

resource "aws_vpc_security_group_ingress_rule" "server_sg_allow_ssh_ipv4" {
  security_group_id = aws_security_group.server_sg.id
  cidr_ipv4         = data.aws_vpc.default.cidr_block
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
  ami = "TODO find debian AMI"
  vpc_security_group_ids = [aws_security_group.server_sg.id]
  key_name = aws_key_pair.server_ssh_key.key_name

  tags = {
    Name = "${local.app}_${var.environment_name}_server"
  }

  root_block_device {
    delete_on_termination = true
    volume_size = 20
    volume_type = "gp3"
  }
}
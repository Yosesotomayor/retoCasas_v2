terraform {
  required_providers {
    oci = {
      source  = "hashicorp/oci"
      version = "= 5.40.0"
    }
    tls = {
      source  = "hashicorp/tls"
      version = "~> 4.0"
    }
    local = {
      source  = "hashicorp/local"
      version = "~> 2.4"
    }
  }
}

provider "oci" {
  config_file_profile = "DEFAULT"
  user_ocid           = var.user_ocid
  fingerprint         = var.fingerprint
  private_key_path    = var.private_key_path
  tenancy_ocid        = var.tenancy_ocid
  region              = var.region
}

resource "oci_core_vcn" "vcn" {
  compartment_id = var.compartment_id
  cidr_block     = "10.0.0.0/16"
  display_name   = "vcn"
}

resource "oci_core_security_list" "public_sn_sl" {
  compartment_id = var.compartment_id
  vcn_id         = oci_core_vcn.vcn.id
  display_name   = "security list for the public subnet"

  egress_security_rules {
    protocol         = 6
    destination_type = "CIDR_BLOCK"
    destination      = "0.0.0.0/0"
    description      = "access to container registries via HTTP"

    tcp_options {
      min = 80
      max = 80
    }
  }

  egress_security_rules {
    protocol         = 6
    destination_type = "CIDR_BLOCK"
    destination      = "0.0.0.0/0"
    description      = "access to container registries via HTTP"

    tcp_options {
      min = 5678
      max = 5678
    }
  }

  egress_security_rules {
    protocol         = 6
    destination_type = "CIDR_BLOCK"
    destination      = "0.0.0.0/0"
    description      = "access to container registries via HTTP"

    tcp_options {
      min = 3000
      max = 3000
    }
  }

  egress_security_rules {
    protocol         = 6
    destination_type = "CIDR_BLOCK"
    destination      = "0.0.0.0/0"
    description      = "access to container registries via HTTP"

    tcp_options {
      min = 465
      max = 465
    }
  }

  egress_security_rules {
    protocol         = 6
    destination_type = "CIDR_BLOCK"
    destination      = "0.0.0.0/0"
    description      = "access to container registries via HTTP"

    tcp_options {
      min = 465
      max = 465
    }
  }

  egress_security_rules {
    protocol         = 6
    destination_type = "CIDR_BLOCK"
    destination      = "0.0.0.0/0"
    description      = "access to container registries via HTTPS"

    tcp_options {
      min = 443
      max = 443
    }
  }

  egress_security_rules {
    protocol         = 17
    destination_type = "CIDR_BLOCK"
    destination      = "0.0.0.0/0"
    description      = "Allow all UDP outbound (needed by Tailscale)"
    udp_options {
      min = 1
      max = 65535
    }
  }
}

resource "oci_core_subnet" "subnet" {
  compartment_id = var.compartment_id
  vcn_id         = oci_core_vcn.vcn.id
  cidr_block     = "10.0.0.0/24"
  display_name   = "subnet"
  route_table_id = oci_core_route_table.igw_rt.id

  security_list_ids = [
    oci_core_security_list.public_sn_sl.id
  ]
}

resource "oci_core_internet_gateway" "internet_gateway" {
  compartment_id = var.compartment_id
  vcn_id         = oci_core_vcn.vcn.id
  display_name   = "internet_gateway"
  enabled        = true
}

resource "oci_core_route_table" "igw_rt" {
  compartment_id = var.compartment_id
  vcn_id         = oci_core_vcn.vcn.id
  display_name   = "Internet gateway route table"

  route_rules {
    network_entity_id = oci_core_internet_gateway.internet_gateway.id
    destination       = "0.0.0.0/0"
  }
}

resource "tls_private_key" "house_ssh_key" {
  algorithm = "RSA"
  rsa_bits  = 4096
}

resource "local_file" "house_private_key" {
  content         = tls_private_key.house_ssh_key.private_key_pem
  filename        = "${path.module}/house_prediction_private.pem"
  file_permission = "0600"
}

resource "local_file" "house_public_key" {
  content         = tls_private_key.house_ssh_key.public_key_openssh
  filename        = "${path.module}/house_prediction_public.pub"
  file_permission = "0644"
}

data "oci_identity_availability_domains" "local_ads" {
  compartment_id = var.compartment_id
}

data "oci_core_images" "free_image" {
  compartment_id           = var.compartment_id
  operating_system         = "Oracle Linux"
  operating_system_version = "8"
  shape                    = "VM.Standard.A1.Flex"
}

resource "oci_core_instance" "app" {
  availability_domain = data.oci_identity_availability_domains.local_ads.availability_domains[0].name
  compartment_id      = var.compartment_id
  display_name        = "app-vm"
  shape               = "VM.Standard.A1.Flex"

  create_vnic_details {
    subnet_id = oci_core_subnet.subnet.id
  }

  shape_config {
    ocpus         = 4
    memory_in_gbs = 24
  }

  metadata = {
    ssh_authorized_keys = tls_private_key.house_ssh_key.public_key_openssh
    user_data = base64encode(<<-EOF
      #!/bin/bash
      
      exec > >(tee /var/log/user-data.log|logger -t user-data -s 2>/dev/console) 2>&1
      echo "Starting server configuration..."

      sudo yum update -y
      sudo yum install -y curl wget git

      curl -fsSL https://tailscale.com/install.sh | sh
      
      sudo systemctl enable tailscaled
      sudo systemctl start tailscaled
      
      echo "Configuring Tailscale with auth key..."
      sudo tailscale up --authkey="${var.tailscale_auth_key}" --accept-routes --accept-dns

      sudo yum install -y yum-utils device-mapper-persistent-data lvm2

      sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
      sudo yum install -y docker-ce docker-ce-cli containerd.io
      
      sudo systemctl enable docker
      sudo systemctl start docker
      sudo usermod -aG docker opc
      newgrp docker
      
      sleep 5
      sudo tailscale status
      
      EOF
    )
  }

  source_details {
    source_type             = "image"
    source_id               = data.oci_core_images.free_image.images[0].id
    boot_volume_size_in_gbs = 200
  }
}

data "oci_core_vnic_attachments" "app_vnic_attachments" {
  compartment_id = var.compartment_id
  instance_id    = oci_core_instance.app.id
}

data "oci_core_vnic" "app_vnic" {
  vnic_id = data.oci_core_vnic_attachments.app_vnic_attachments.vnic_attachments[0].vnic_id
}

output "app_public_ip" {
  value = data.oci_core_vnic.app_vnic.public_ip_address
}

output "ssh_private_key_path" {
  value = local_file.house_private_key.filename
  description = "Path to the generated SSH private key file"
}

output "ssh_connection_command" {
  value = "ssh -i ${local_file.house_private_key.filename} opc@${data.oci_core_vnic.app_vnic.public_ip_address}"
  description = "SSH command to connect to the instance"
}

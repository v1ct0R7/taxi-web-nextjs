-- Tirana Ride — skema e databazës MySQL (gjeneruar nga modelet Sequelize)
-- Nuk është e nevojshme ta ekzekutosh: backend-i i krijon tabelat vetë në nisje (sequelize.sync).
-- Përdore nëse do t'i krijosh tabelat manualisht ose për referencë.

CREATE DATABASE IF NOT EXISTS `taxi_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `taxi_db`;

CREATE TABLE `admins` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `password` varchar(100) NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `drivers` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `password` varchar(100) NOT NULL,
  `car_model` varchar(80) NOT NULL,
  `plate_number` varchar(20) NOT NULL,
  `status` enum('offline','available','busy') NOT NULL DEFAULT 'offline',
  `active` tinyint(1) NOT NULL DEFAULT 1,
  `last_seen_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `phone` (`phone`),
  UNIQUE KEY `plate_number` (`plate_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `city_routes` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `city` varchar(80) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `return_price` decimal(10,2) NOT NULL,
  `duration_minutes` int(10) unsigned NOT NULL DEFAULT 60,
  `distance_km` int(10) unsigned NOT NULL DEFAULT 0,
  `active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `city` (`city`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `settings` (
  `id` int(10) unsigned NOT NULL DEFAULT 1,
  `base_fare` decimal(10,2) NOT NULL DEFAULT 2.50,
  `per_km` decimal(10,2) NOT NULL DEFAULT 0.90,
  `minimum_fare` decimal(10,2) NOT NULL DEFAULT 4.00,
  `promo_window_hours` int(10) unsigned NOT NULL DEFAULT 3,
  `support_phone` varchar(20) NOT NULL DEFAULT '+355681234567',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `rides` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `access_code` varchar(64) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `type` enum('city','intercity','return_promo') NOT NULL DEFAULT 'city',
  `status` enum('pending','accepted','picked_up','completed','cancelled') NOT NULL DEFAULT 'pending',
  `origin_city` varchar(80) NOT NULL,
  `destination_city` varchar(80) NOT NULL,
  `pickup_address` varchar(255) NOT NULL,
  `pickup_lat` decimal(10,7) DEFAULT NULL,
  `pickup_lng` decimal(10,7) DEFAULT NULL,
  `dropoff_address` varchar(255) NOT NULL,
  `dropoff_lat` decimal(10,7) DEFAULT NULL,
  `dropoff_lng` decimal(10,7) DEFAULT NULL,
  `distance_km` decimal(10,2) DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `note` varchar(300) DEFAULT NULL,
  `cancelled_by` enum('client','driver','admin','system') DEFAULT NULL,
  `cancel_reason` varchar(300) DEFAULT NULL,
  `accepted_at` datetime DEFAULT NULL,
  `picked_up_at` datetime DEFAULT NULL,
  `completed_at` datetime DEFAULT NULL,
  `cancelled_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `driver_id` int(10) unsigned DEFAULT NULL,
  `city_route_id` int(10) unsigned DEFAULT NULL,
  `promo_id` int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `driver_id` (`driver_id`),
  KEY `city_route_id` (`city_route_id`),
  KEY `rides_status` (`status`),
  KEY `rides_phone` (`phone`),
  KEY `rides_created_at` (`created_at`),
  KEY `rides_promo_id` (`promo_id`),
  CONSTRAINT `rides_ibfk_1` FOREIGN KEY (`driver_id`) REFERENCES `drivers` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `rides_ibfk_2` FOREIGN KEY (`city_route_id`) REFERENCES `city_routes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `return_promos` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `from_city` varchar(80) NOT NULL,
  `to_city` varchar(80) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `regular_price` decimal(10,2) NOT NULL,
  `available_from` datetime NOT NULL,
  `expires_at` datetime NOT NULL,
  `status` enum('active','claimed','expired','cancelled') NOT NULL DEFAULT 'active',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `source_ride_id` int(10) unsigned DEFAULT NULL,
  `claimed_ride_id` int(10) unsigned DEFAULT NULL,
  `driver_id` int(10) unsigned DEFAULT NULL,
  `city_route_id` int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `source_ride_id` (`source_ride_id`),
  KEY `driver_id` (`driver_id`),
  KEY `city_route_id` (`city_route_id`),
  KEY `return_promos_status_expires_at` (`status`,`expires_at`),
  CONSTRAINT `return_promos_ibfk_1` FOREIGN KEY (`source_ride_id`) REFERENCES `rides` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `return_promos_ibfk_2` FOREIGN KEY (`driver_id`) REFERENCES `drivers` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `return_promos_ibfk_3` FOREIGN KEY (`city_route_id`) REFERENCES `city_routes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `activity_logs` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `actor_type` enum('client','driver','admin','system') NOT NULL,
  `actor_id` varchar(40) DEFAULT NULL,
  `action` varchar(40) NOT NULL,
  `details` varchar(500) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `ride_id` int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `activity_logs_created_at` (`created_at`),
  KEY `activity_logs_action` (`action`),
  KEY `activity_logs_ride_id` (`ride_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

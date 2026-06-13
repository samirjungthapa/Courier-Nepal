-- database/schema.sql

-- Drop existing tables to avoid conflicts
DROP TABLE IF EXISTS SystemLogs;
DROP TABLE IF EXISTS BulkShipments;
DROP TABLE IF EXISTS Wholesalers;
DROP TABLE IF EXISTS DeliveryStaff;
DROP TABLE IF EXISTS Admins;
DROP TABLE IF EXISTS PickupRequests;
DROP TABLE IF EXISTS Payments;
DROP TABLE IF EXISTS ParcelStatus;
DROP TABLE IF EXISTS Parcels;
DROP TABLE IF EXISTS Users;
DROP TABLE IF EXISTS Roles;

-- Roles Table
CREATE TABLE Roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert predefined roles
INSERT INTO Roles (name) VALUES ('SuperAdmin'), ('Admin'), ('User');

-- Users Table
CREATE TABLE Users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    roleId INT NOT NULL,
    firstName VARCHAR(100) NOT NULL,
    lastName VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    address TEXT,
    city VARCHAR(100),
    isActive BOOLEAN DEFAULT TRUE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (roleId) REFERENCES Roles(id) ON DELETE RESTRICT
);

-- Parcels Table
CREATE TABLE Parcels (
    id INT AUTO_INCREMENT PRIMARY KEY,
    trackingNumber VARCHAR(50) NOT NULL UNIQUE,
    senderId INT NOT NULL,
    receiverName VARCHAR(150) NOT NULL,
    receiverPhone VARCHAR(20) NOT NULL,
    receiverAddress TEXT NOT NULL,
    receiverCity VARCHAR(100),
    weight DECIMAL(5,2) NOT NULL, -- in kg
    dimensions VARCHAR(100), -- L x W x H
    declaredValue DECIMAL(10,2),
    deliveryCharge DECIMAL(10,2) NOT NULL,
    currentStatus VARCHAR(50) DEFAULT 'Order Created',
    estimatedDeliveryDate DATE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (senderId) REFERENCES Users(id) ON DELETE CASCADE
);

-- ParcelStatus Table (for tracking history)
CREATE TABLE ParcelStatus (
    id INT AUTO_INCREMENT PRIMARY KEY,
    parcelId INT NOT NULL,
    status VARCHAR(50) NOT NULL, -- Order Created, Picked Up, In Transit, Out for Delivery, Delivered
    location VARCHAR(200),
    notes TEXT,
    updatedBy INT, -- ID of Admin/DeliveryStaff
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parcelId) REFERENCES Parcels(id) ON DELETE CASCADE,
    FOREIGN KEY (updatedBy) REFERENCES Users(id) ON DELETE SET NULL
);

-- Payments Table
CREATE TABLE Payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    parcelId INT NOT NULL,
    userId INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    paymentMethod VARCHAR(50) DEFAULT 'Pending', -- eSewa, Khalti, COD
    transactionId VARCHAR(100) UNIQUE,
    status VARCHAR(50) DEFAULT 'Pending', -- Pending, Completed, Failed
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (parcelId) REFERENCES Parcels(id) ON DELETE CASCADE,
    FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE RESTRICT
);

-- PickupRequests Table
CREATE TABLE PickupRequests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    parcelId INT NOT NULL UNIQUE,
    pickupDate DATE NOT NULL,
    pickupTimeSlot VARCHAR(50) NOT NULL,
    pickupAddress TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'Scheduled', -- Scheduled, Completed, Cancelled
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (parcelId) REFERENCES Parcels(id) ON DELETE CASCADE
);

-- DeliveryStaff Table (Extension of Users for delivery specific details)
CREATE TABLE DeliveryStaff (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userId INT NOT NULL UNIQUE,
    vehicleType VARCHAR(50),
    vehicleNumber VARCHAR(50),
    licenseNumber VARCHAR(50),
    isAvailable BOOLEAN DEFAULT TRUE,
    currentLocation VARCHAR(200),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE
);

-- Parcels Delivery Assignment (Many-to-Many via updating Parcel or separate table, simplifying by adding to ParcelStatus or tracking assignment directly)
-- Adding assignedStaffId to Parcels table is easier:
ALTER TABLE Parcels ADD COLUMN assignedStaffId INT;
ALTER TABLE Parcels ADD CONSTRAINT fk_assigned_staff FOREIGN KEY (assignedStaffId) REFERENCES Users(id) ON DELETE SET NULL;

-- Wholesalers Table (Extension of Users for business accounts)
CREATE TABLE Wholesalers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userId INT NOT NULL UNIQUE,
    companyName VARCHAR(150),
    businessRegistrationNumber VARCHAR(100),
    discountRate DECIMAL(5,2) DEFAULT 0.00,
    apiKey VARCHAR(255) UNIQUE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE
);

-- BulkShipments Table
CREATE TABLE BulkShipments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    wholesalerId INT NOT NULL,
    batchReference VARCHAR(100) UNIQUE,
    totalParcels INT NOT NULL,
    status VARCHAR(50) DEFAULT 'Processing', -- Processing, Processed, Failed
    manifestFileUrl VARCHAR(255),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (wholesalerId) REFERENCES Wholesalers(id) ON DELETE CASCADE
);

-- SystemLogs Table
CREATE TABLE SystemLogs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userId INT,
    action VARCHAR(100) NOT NULL,
    details TEXT,
    ipAddress VARCHAR(50),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE SET NULL
);

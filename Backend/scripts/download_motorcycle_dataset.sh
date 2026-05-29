#!/bin/bash
# Download the motorcycle technical specifications dataset from Kaggle
# Ensure kaggle CLI is installed and configured (kaggle.json placed in ~/.kaggle)

# Exit on any error
set -e

# Create a data directory if it doesn't exist
DATA_DIR="$(dirname "$0")/../data/motorcycle"
mkdir -p "$DATA_DIR"

# Change to the data directory
cd "$DATA_DIR"

# Download the dataset (will create a zip file)
kaggle datasets download -d emmanuelfwerr/motorcycle-technical-specifications-19702022

# Unzip the dataset
unzip "motorcycle-technical-specifications-19702022.zip"

# Clean up zip file
rm "motorcycle-technical-specifications-19702022.zip"

echo "Dataset downloaded and extracted to $DATA_DIR"

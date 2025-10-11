#!/bin/bash

# Script to create .env file from env.example
echo "Creating .env file from env.example..."

# Check if .env already exists
if [ -f ".env" ]; then
    echo "Warning: .env file already exists. Do you want to overwrite it? (y/n)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        cp env.example .env
        echo ".env file created successfully!"
    else
        echo "Operation cancelled."
        exit 0
    fi
else
    cp env.example .env
    echo ".env file created successfully!"
fi

echo "Please review the .env file and update any values as needed."
echo "Then restart your backend server for the changes to take effect." 
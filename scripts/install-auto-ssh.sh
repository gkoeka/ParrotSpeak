#!/bin/bash

# ParrotSpeak - Install Automatic SSH Setup
# Run this once to enable SSH key setup on every shell session

echo "🔧 Installing automatic SSH setup for ParrotSpeak..."

# Create the SSH setup command in .bashrc
if ! grep -q "ParrotSpeak SSH Auto-Setup" ~/.bashrc; then
    cat << 'EOF' >> ~/.bashrc

# ParrotSpeak SSH Auto-Setup
if [ -f ~/workspace/scripts/setup-ssh.sh ]; then
    ~/workspace/scripts/setup-ssh.sh true > /dev/null 2>&1
fi
EOF
    echo "✅ Added SSH auto-setup to .bashrc"
else
    echo "✅ SSH auto-setup already installed in .bashrc"
fi

# Make setup script executable
chmod +x scripts/setup-ssh.sh

# Run the setup once now
./scripts/setup-ssh.sh

echo "🚀 Auto SSH setup installed successfully!"
echo "   SSH key will now be configured automatically on every workspace load"
echo "   No manual setup required in future sessions"
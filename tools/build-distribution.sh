#!/bin/bash

# DSDS Distribution Builder
# Creates a clean zip file for distribution

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
OUTPUT_DIR="$SCRIPT_DIR"
ZIP_NAME="dsds-v1.1-starter-pack.zip"
TEMP_DIR=$(mktemp -d)
DIST_DIR="$TEMP_DIR/dsds-v1.1-starter-pack"

echo "Building DSDS distribution package..."
echo "Source: $PROJECT_ROOT"
echo "Output: $OUTPUT_DIR/$ZIP_NAME"

# Create distribution directory
mkdir -p "$DIST_DIR"

# Copy included files and folders
echo "Copying files..."

# Core documentation
cp "$PROJECT_ROOT/README.md" "$DIST_DIR/"
cp "$PROJECT_ROOT/QUICKSTART.md" "$DIST_DIR/"
cp "$PROJECT_ROOT/GETTING_STARTED.md" "$DIST_DIR/"
[ -f "$PROJECT_ROOT/CHANGELOG.md" ] && cp "$PROJECT_ROOT/CHANGELOG.md" "$DIST_DIR/"
[ -f "$PROJECT_ROOT/LICENSE" ] && cp "$PROJECT_ROOT/LICENSE" "$DIST_DIR/"

# v1.1 schemas and examples
cp -r "$PROJECT_ROOT/v1.1" "$DIST_DIR/"

# Documentation folder
cp -r "$PROJECT_ROOT/documentation" "$DIST_DIR/"

# Tools (excluding node_modules)
mkdir -p "$DIST_DIR/tools"

# Validators
cp -r "$PROJECT_ROOT/tools/validators" "$DIST_DIR/tools/"
rm -rf "$DIST_DIR/tools/validators/node_modules"

# Figma plugin
cp -r "$PROJECT_ROOT/tools/figma-plugin" "$DIST_DIR/tools/"
rm -rf "$DIST_DIR/tools/figma-plugin/node_modules"

# Claude Manager
cp -r "$PROJECT_ROOT/tools/claude-manager" "$DIST_DIR/tools/"

# Backlog tool (for reference, though project-specific)
[ -f "$PROJECT_ROOT/tools/backlog.js" ] && cp "$PROJECT_ROOT/tools/backlog.js" "$DIST_DIR/tools/"

# .claude folder (skills and context)
mkdir -p "$DIST_DIR/.claude"
cp -r "$PROJECT_ROOT/.claude/skills" "$DIST_DIR/.claude/"
[ -f "$PROJECT_ROOT/.claude/PROJECT_CONTEXT.md" ] && cp "$PROJECT_ROOT/.claude/PROJECT_CONTEXT.md" "$DIST_DIR/.claude/"
[ -f "$PROJECT_ROOT/.claude/VERSIONING_WORKFLOW.md" ] && cp "$PROJECT_ROOT/.claude/VERSIONING_WORKFLOW.md" "$DIST_DIR/.claude/"

# Copy commands if they exist
[ -d "$PROJECT_ROOT/.claude/commands" ] && cp -r "$PROJECT_ROOT/.claude/commands" "$DIST_DIR/.claude/"

# Clean up excluded files
echo "Cleaning up..."

# Remove .DS_Store files
find "$DIST_DIR" -name ".DS_Store" -delete

# Remove Archive folders
find "$DIST_DIR" -type d -name "Archive" -exec rm -rf {} + 2>/dev/null || true

# Remove any settings.local.json
find "$DIST_DIR" -name "settings.local.json" -delete

# Remove any generated indexes
find "$DIST_DIR" -name ".dsds-index.json" -delete
find "$DIST_DIR" -name "artifacts-index.json" -delete

# Remove backlog files (project-specific)
rm -f "$DIST_DIR/backlog.json"
rm -f "$DIST_DIR/BACKLOG.md"

# Remove any .git folders
find "$DIST_DIR" -type d -name ".git" -exec rm -rf {} + 2>/dev/null || true

# Create the zip
echo "Creating zip..."
cd "$TEMP_DIR"
zip -r "$OUTPUT_DIR/$ZIP_NAME" "dsds-v1.1-starter-pack" -x "*.DS_Store"

# Cleanup
rm -rf "$TEMP_DIR"

# Report
echo ""
echo "✅ Distribution package created: $OUTPUT_DIR/$ZIP_NAME"
echo ""
echo "Contents:"
echo "  - README.md, QUICKSTART.md, GETTING_STARTED.md"
echo "  - v1.1/ (schemas and examples)"
echo "  - documentation/ (guides and references)"
echo "  - tools/validators/ (CLI validation)"
echo "  - tools/figma-plugin/ (Figma integration)"
echo "  - tools/claude-manager/ (scale management)"
echo "  - .claude/skills/ (19 Claude skills)"
echo ""
echo "To use:"
echo "  1. Extract the zip anywhere"
echo "  2. Open the folder in Claude Desktop or Claude Code"
echo "  3. Say 'Build a persona for [your user type]'"
echo ""
echo "For CLI validators, run: cd tools/validators && npm install"

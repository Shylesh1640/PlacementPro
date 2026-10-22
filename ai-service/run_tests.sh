#!/bin/bash
# Run PlacementPro AI service tests
# Usage: bash run_tests.sh
cd "$(dirname "$0")"
python -m pytest tests/ -v --tb=short

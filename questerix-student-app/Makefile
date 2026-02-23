# Questerix Student App - Standalone Workflow

.PHONY: setup get test watch build clean help

help:
	@echo "Questerix Student App Commands:"
	@echo "  make setup     - Install dependencies and local tools"
	@echo "  make get       - Run flutter pub get"
	@echo "  make generate  - Run build_runner"
	@echo "  make watch     - Run build_runner in watch mode"
	@echo "  make test      - Run all tests"
	@echo "  make coverage  - Run tests with coverage"
	@echo "  make build-web - Build for Web"
	@echo "  make clean     - Clean build artifacts"

setup:
	flutter pub get

get:
	flutter pub get

generate:
	dart run build_runner build --delete-conflicting-outputs

watch:
	dart run build_runner watch --delete-conflicting-outputs

test:
	flutter test

coverage:
	flutter test --coverage

build-web:
	flutter build web --release --no-tree-shake-icons

clean:
	flutter clean
	rm -rf build/

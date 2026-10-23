# Run HeritageBD locally:  make
# Starts the PHP API and the website together. Press Ctrl-C to stop both.
# Needs XAMPP's MySQL running with the `heritagebd` database (see README).

SHELL := bash

PHP      ?= $(if $(wildcard /c/xampp/php/php.exe),/c/xampp/php/php.exe,php)
API_PORT ?= 8080
WEB_PORT ?= 8443

.PHONY: run
run:
	@[ -d node_modules ] || npm install
	@[ -f .env ] || cp .env.example .env
	@echo "Website -> http://localhost:$(WEB_PORT)"
	@echo "API     -> http://localhost:$(API_PORT)/api/places"
	@cd backend && "$(PHP)" -S localhost:$(API_PORT) index.php & \
	  PORT=$(WEB_PORT) VITE_API_URL=http://localhost:$(API_PORT) npm run dev

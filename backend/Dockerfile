# HeritageBD API container (used for Render; works on any Docker host).
#
# Build from the REPOSITORY ROOT so the committed images are included:
#   docker build -f backend/Dockerfile -t heritagebd-api .
# On Render: Dockerfile Path = backend/Dockerfile, Docker Build Context Directory = .
FROM php:8.2-apache

# pdo_pgsql for Supabase (PostgreSQL), pdo_mysql so the same image still runs against MySQL.
RUN apt-get update && apt-get install -y --no-install-recommends libpq-dev \
 && docker-php-ext-install pdo_mysql pdo_pgsql \
 && rm -rf /var/lib/apt/lists/* \
 && a2enmod rewrite headers \
 && sed -ri 's/AllowOverride None/AllowOverride All/g' /etc/apache2/apache2.conf

COPY backend/ /var/www/html/

# Uploads live outside the web root. The product/profile images committed to git
# (the database points at them) are baked into the image, so they survive restarts.
# Files uploaded after deploy go to the same folder; on Render's free tier that disk
# is ephemeral, so those disappear on restart/redeploy unless a persistent disk is
# mounted at this path.
ENV HERITAGE_UPLOAD_DIR=/var/heritagebd-uploads
COPY heritagebd-data/uploads/products/ /var/heritagebd-uploads/products/
COPY heritagebd-data/uploads/profiles/ /var/heritagebd-uploads/profiles/
RUN mkdir -p /var/heritagebd-uploads/private \
 && chown -R www-data:www-data /var/heritagebd-uploads

# Render (and most PaaS) tell the container which port to listen on via $PORT.
CMD sed -i "s/Listen 80/Listen ${PORT:-80}/" /etc/apache2/ports.conf \
 && sed -i "s/:80>/:${PORT:-80}>/" /etc/apache2/sites-enabled/000-default.conf \
 && apache2-foreground

# HeritageBD API container (used for Render; works on any Docker host).
FROM php:8.2-apache

RUN docker-php-ext-install pdo_mysql \
 && a2enmod rewrite headers \
 && sed -ri 's/AllowOverride None/AllowOverride All/g' /etc/apache2/apache2.conf

COPY . /var/www/html/

# Uploads live outside the web root. On Render's free tier this disk is
# ephemeral: files uploaded after deploy disappear on restart/redeploy.
ENV HERITAGE_UPLOAD_DIR=/var/heritagebd-uploads
RUN mkdir -p /var/heritagebd-uploads && chown -R www-data:www-data /var/heritagebd-uploads

# Render (and most PaaS) tell the container which port to listen on via $PORT.
CMD sed -i "s/Listen 80/Listen ${PORT:-80}/" /etc/apache2/ports.conf \
 && sed -i "s/:80>/:${PORT:-80}>/" /etc/apache2/sites-enabled/000-default.conf \
 && apache2-foreground

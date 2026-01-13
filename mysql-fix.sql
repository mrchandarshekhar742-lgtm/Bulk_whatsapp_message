ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'WhatsApp@2025!';
FLUSH PRIVILEGES;
SELECT user,authentication_string,plugin,host FROM mysql.user WHERE user='root';
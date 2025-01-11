{pkgs}: {
  deps = [
    pkgs.zip
    pkgs.redis
    pkgs.libxcrypt
    pkgs.postgresql
  ];
}

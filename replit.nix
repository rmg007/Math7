{ pkgs }: {
  deps = [
    pkgs.flutter
    pkgs.nodejs-18_x
    pkgs.nodePackages.npm
    pkgs.bashInteractive
    pkgs.git
  ];
}

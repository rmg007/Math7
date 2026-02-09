{ pkgs }: {
  deps = [
    pkgs.nodejs-20_x
    pkgs.nodePackages.typescript-language-server
    pkgs.yarn
    pkgs.replitPackages.jest
    pkgs.jdk17_headless
    pkgs.flutter
    pkgs.bashInteractive
    pkgs.man
    pkgs.postgresql
    pkgs.nano
    pkgs.vim
    pkgs.git
  ];
}

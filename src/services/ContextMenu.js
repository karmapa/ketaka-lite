const remote = window.require('remote');
const Menu = remote.require('menu');
const MenuItem = remote.require('menu-item');

export default class ContextMenu {

  static init() {

    const menu = new Menu();

    menu.append(new MenuItem({
      label: 'Copy',
      accelerator: 'CmdOrCtrl+C',
      role: 'copy'
    }));

    menu.append(new MenuItem({
      label: 'Cut',
      accelerator: 'CmdOrCtrl+X',
      role: 'cut'
    }));

    menu.append(new MenuItem({
      label: 'Paste',
      accelerator: 'CmdOrCtrl+V',
      role: 'paste'
    }));

    window.addEventListener('contextmenu', e => {
      e.preventDefault();
      menu.popup(remote.getCurrentWindow());
    });
  }

}

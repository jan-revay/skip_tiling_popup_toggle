import Gio from 'gi://Gio';
import Meta from 'gi://Meta';
import Shell from 'gi://Shell';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';

const KEYBINDING = 'toggle-skip-taskbar';

export default class SkipTaskbarToggleExtension extends Extension {
    enable() {
        this._settings = this.getSettings();
        Main.wm.addKeybinding(
            KEYBINDING,
            this._settings,
            Meta.KeyBindingFlags.NONE,
            Shell.ActionMode.NORMAL,
            () => this._toggleFocusedWindow());
    }

    disable() {
        // Overrides already applied to windows are intentionally left in place.
        Main.wm.removeKeybinding(KEYBINDING);
        this._settings = null;
    }

    _toggleFocusedWindow() {
        const win = global.display.focus_window;
        if (!win)
            return;

        // An own property on the instance shadows the GObject accessor on the
        // prototype; deleting it restores the real value.
        const overridden = Object.getOwnPropertyDescriptor(win, 'skip_taskbar') !== undefined;
        if (overridden) {
            delete win.skip_taskbar;
        } else {
            Object.defineProperty(win, 'skip_taskbar', {
                get() {
                    return true;
                },
                configurable: true,
            });
        }

        // Let JS listeners (taskbars, tiling extensions) re-read the property.
        win.notify('skip-taskbar');

        let title = win.title ?? '';
        if (title.length > 25)
            title = `${title.slice(0, 24)}…`;
        const label = overridden
            ? `Skip taskbar OFF: ${title}`
            : `Skip taskbar ON: ${title}`;
        Main.osdWindowManager.show(-1,
            Gio.ThemedIcon.new(overridden ? 'view-reveal-symbolic' : 'view-conceal-symbolic'),
            label, null);
    }
}

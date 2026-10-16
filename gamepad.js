/* Catacumbas de Golzdov — controles Xbox/Gamepad API (sem dependências). */
(function (root) {
  'use strict';
  const DEAD_ZONE = 0.52;
  const HOLD_DELAY = 250;
  const REPEAT_DELAY = 155;

  function create(callbacks) {
    let activeIndex = null;
    let connected = false;
    let pressedPreviously = new Set();
    let lastDirection = '';
    let nextRepeat = 0;
    let selectedButton = null;
    let selectedContext = '';

    function status(isConnected, id) {
      if (isConnected === connected) return;
      connected = isConnected;
      if (!connected) {
        pressedPreviously.clear();
        lastDirection = '';
        clearFocus();
      }
      callbacks.onConnectionChange?.(isConnected, id || '');
    }
    function getPad() {
      if (typeof navigator === 'undefined' || typeof navigator.getGamepads !== 'function') return null;
      let pads;
      try { pads = navigator.getGamepads(); } catch (_) { return null; }
      if (!pads) return null;
      if (activeIndex !== null) {
        const current = pads[activeIndex];
        if (current && current.connected !== false && current.buttons?.length >= 16) return current;
      }
      // Xbox/XInput controls expose the standard gamepad mapping on modern browsers.
      const next = Array.from(pads).find(p => p && p.connected !== false && p.buttons?.length >= 16 && p.mapping === 'standard') ||
        Array.from(pads).find(p => p && p.connected !== false && p.buttons?.length >= 16);
      activeIndex = next ? next.index : null;
      return next || null;
    }
    function down(pad, index) {
      const b = pad.buttons[index];
      return !!b && (b.pressed === true || b.value > 0.55);
    }
    function clearFocus() {
      if (selectedButton) selectedButton.classList?.remove('gamepad-focused');
      selectedButton = null;
      selectedContext = '';
    }
    function availableButtons(context) {
      const selector = context === 'modal' ? '#modal button' : context === 'home' ? '#home button' : '#select button';
      const buttons = Array.from(document.querySelectorAll(selector)).filter(b =>
        !b.disabled && !b.hidden && !b.classList?.contains('hidden') &&
        !b.closest?.('.hidden') &&
        (typeof b.getClientRects !== 'function' || b.getClientRects().length > 0)
      );
      if (context !== 'modal') return buttons;
      // Prefer an actual decision over the little X of a closable dialog.
      return [...buttons.filter(b => !b.classList.contains('close-modal')),
        ...buttons.filter(b => b.classList.contains('close-modal'))];
    }
    function focusButton(button, context) {
      if (selectedButton === button && selectedContext === context) return;
      clearFocus();
      selectedButton = button;
      selectedContext = context;
      if (!button) return;
      button.classList.add('gamepad-focused');
      try { button.focus({ preventScroll: true }); } catch (_) {}
      try { button.scrollIntoView({ block: 'nearest', behavior: 'instant' }); } catch (_) {}
    }
    function ensureFocus(context) {
      const items = availableButtons(context);
      if (selectedContext !== context || !items.includes(selectedButton)) focusButton(items[0] || null, context);
      return items;
    }
    function navigateMenu(context, direction) {
      const buttons = ensureFocus(context);
      if (!buttons.length) return;
      const offset = direction === 'up' || direction === 'left' ? -1 : 1;
      const index = buttons.indexOf(selectedButton);
      focusButton(buttons[(index + offset + buttons.length) % buttons.length], context);
    }
    function currentContext() { return callbacks.getContext(); }
    function directionalAction(direction) {
      const context = currentContext();
      if (context === 'game') {
        const delta = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[direction];
        callbacks.onDirection?.(...delta);
      } else if (context === 'home' || context === 'select' || context === 'modal') navigateMenu(context, direction);
    }
    function confirm() {
      const context = currentContext();
      if (context === 'game') return callbacks.onConfirm?.();
      const items = ensureFocus(context);
      if (items.includes(selectedButton) && !selectedButton.disabled) {
        const button = selectedButton;
        // The click may replace the entire modal or screen.
        button.click();
      }
    }
    function cancel() {
      const context = currentContext();
      if (context === 'modal') return callbacks.onModalBack?.();
      if (context === 'game') return callbacks.onGameBack?.();
      if (context === 'select') return callbacks.onSelectionBack?.();
    }
    function buttonAction(index) {
      const context = currentContext();
      if (index === 0) return confirm();                  // A: confirmar/atacar
      if (index === 1) return cancel();                   // B: voltar/cancelar
      if (context !== 'game') return;
      if (index === 2) return callbacks.onSkill?.(0);     // X: habilidade 1
      if (index === 3) return callbacks.onSkill?.(1);     // Y: habilidade 2
      if (index === 4) return callbacks.onLeftShoulder?.();// LB: bolsa/alvo anterior
      if (index === 5) return callbacks.onRightShoulder?.();// RB: mapa/próximo alvo
      if (index === 6) return callbacks.onPotion?.();     // LT: poção
      if (index === 7) return callbacks.onWait?.();       // RT: esperar
      if (index === 8) return callbacks.onJournal?.();    // View: registros
      if (index === 9) return callbacks.onMenu?.();       // Menu: pausa
    }
    function readDirection(pad) {
      let x = 0, y = 0;
      if (down(pad, 14)) x = -1;
      else if (down(pad, 15)) x = 1;
      if (down(pad, 12)) y = -1;
      else if (down(pad, 13)) y = 1;
      if (!x && !y) {
        // Right stick may aim during spell-targeting; left stick always moves/navigates.
        const leftX = pad.axes?.[0] || 0, leftY = pad.axes?.[1] || 0;
        const rightX = pad.axes?.[2] || 0, rightY = pad.axes?.[3] || 0;
        if (callbacks.isAiming?.() && Math.max(Math.abs(rightX), Math.abs(rightY)) >= DEAD_ZONE) {
          x = rightX; y = rightY;
        } else if (Math.max(Math.abs(leftX), Math.abs(leftY)) >= DEAD_ZONE) {
          x = leftX; y = leftY;
        }
      }
      if (Math.max(Math.abs(x), Math.abs(y)) < DEAD_ZONE) return '';
      return Math.abs(x) > Math.abs(y) ? x > 0 ? 'right' : 'left' : y > 0 ? 'down' : 'up';
    }
    function poll(time = 0) {
      const pad = getPad();
      if (!pad) {
        activeIndex = null;
        status(false);
        return;
      }
      status(true, pad.id);
      const context = currentContext();
      if (context !== 'game') ensureFocus(context);
      else if (selectedButton) clearFocus();

      // A single press triggers exactly one action; no repeats for skills/potions.
      const pressed = new Set();
      for (let index = 0; index <= 9; index++) {
        if (!down(pad, index)) continue;
        pressed.add(index);
        if (!pressedPreviously.has(index)) buttonAction(index);
      }
      pressedPreviously = pressed;

      const direction = readDirection(pad);
      const current = currentContext();
      if (selectedContext !== current && current !== 'game') ensureFocus(current);
      if (!direction) {
        lastDirection = '';
        nextRepeat = 0;
      } else if (direction !== lastDirection || time >= nextRepeat) {
        directionalAction(direction);
        nextRepeat = direction !== lastDirection ? time + HOLD_DELAY : time + REPEAT_DELAY;
        lastDirection = direction;
      }
    }
    return { poll, isConnected: () => connected };
  }

  root.GolzdovGamepad = { create };
})(window);

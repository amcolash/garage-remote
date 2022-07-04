import React, { useEffect, useState } from 'react';
import { cssRule, style } from 'typestyle';

import lock from './icons/lock.svg';
import server from './icons/server.svg';
import trash from './icons/trash.svg';

import { Lock } from './Lock';
import { Toggle } from './Toggle';
import { codeKey, cryptKey, serverKey } from './const';

cssRule('*', {
  userSelect: 'none',
});

const button = style({
  position: 'absolute',
  bottom: '1em',
  background: 'none',
  border: 'none',
  $nest: { img: { width: '1em', height: '1em' } },
});

export function App() {
  // Only lock when in prod
  const shouldLock = import.meta.env.PROD || true;

  const [locked, setLocked] = useState(shouldLock);

  useEffect(() => {
    setTimeout(() => setLocked(true), 1000 * 60);
  }, [locked, setLocked]);

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: 'sans-serif',
      }}
    >
      {locked ? <Lock setLocked={setLocked} /> : <Toggle />}

      {!locked && (
        <button className={button} style={{ left: '1em' }} onClick={() => setLocked(true)}>
          <img src={lock} />
        </button>
      )}

      {!locked && (
        <button
          className={button}
          style={{ right: '3.5em' }}
          onClick={() => {
            if (confirm('Do you want to reset server?')) {
              localStorage.removeItem(serverKey);

              window.location.reload();
            }
          }}
        >
          <img src={server} />
        </button>
      )}

      <button
        className={button}
        style={{ right: '1em' }}
        onClick={() => {
          if (confirm('Do you want to clear all settings?')) {
            localStorage.removeItem(codeKey);
            localStorage.removeItem(cryptKey);
            localStorage.removeItem(serverKey);

            window.location.reload();
          }
        }}
      >
        <img src={trash} />
      </button>
    </div>
  );
}

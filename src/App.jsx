import React, { useCallback, useEffect, useState } from 'react';
import { cssRule, style } from 'typestyle';

import lock from './icons/lock.svg';
import serverIcon from './icons/server.svg';
import trash from './icons/trash.svg';
import arrowDown from './icons/arrow-down.svg';
import arrowUp from './icons/arrow-up.svg';

import { Lock } from './Lock';
import { Toggle } from './Toggle';
import { codeKey, cryptKey, serverKey } from './const';

cssRule('*', {
  userSelect: 'none',
});

const button = style({
  position: 'absolute',
  bottom: '1em',
  width: '2.25em',
  height: '2.25em',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  background: 'none',
  border: 'none',
  $nest: { img: { width: '1em', height: '1em' } },
});

// Only lock when in prod
const shouldLock = import.meta.env.PROD;

let inactiveTimeout;

export function App() {
  const [locked, setLocked] = useState(shouldLock);
  const [doorStatus, setDoorStatus] = useState(undefined);

  // On load and whenever there is a click, reset timer to lock
  const setTimer = useCallback(() => {
    if (inactiveTimeout) clearTimeout(inactiveTimeout);
    inactiveTimeout = setTimeout(() => setLocked(true), 1000 * 60);
  }, [locked, setLocked]);

  useEffect(() => {
    setTimer();
  }, [setTimer]);

  const updateDoorStatus = useCallback(() => {
    const server = localStorage.getItem(serverKey);

    if (server) {
      fetch(`${server}/status`)
        .then((res) => res.json())
        .then((data) => {
          setDoorStatus(data.open);
        });
    }
  }, [serverKey, setDoorStatus]);

  useEffect(() => {
    updateDoorStatus();
    setInterval(updateDoorStatus, 7000);
  }, [updateDoorStatus]);

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: 'sans-serif',
        position: 'relative',
      }}
      onClick={(e) => setTimer()}
    >
      <h1 style={{ color: '#ccc', textAlign: 'center', marginTop: 0, marginBottom: '1em' }}>Garage Remote</h1>

      {locked ? <Lock setLocked={setLocked} /> : <Toggle />}

      {!locked && (
        <button className={button} style={{ left: '1em' }} onClick={() => setLocked(true)}>
          <img src={lock} />
        </button>
      )}

      {!locked && (
        <button
          className={button}
          style={{ right: '4.25em' }}
          onClick={() => {
            if (confirm('Do you want to reset server?')) {
              localStorage.removeItem(serverKey);

              window.location.reload();
            }
          }}
        >
          <img src={serverIcon} />
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

      {!locked && doorStatus !== undefined && <img src={doorStatus ? arrowUp : arrowDown} style={{ width: '2.5em', height: '2.5em' }} />}
    </div>
  );
}

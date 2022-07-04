import React, { useEffect, useState } from 'react';
import totp from 'totp-generator';
import { style } from 'typestyle';
import { cryptKey, serverKey } from './const';

import { ReactComponent as Icon } from './icons/toggle.svg';

const button = style({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  width: 'min(50vh, 50vw)',
  height: 'min(50vh, 50vw)',
  border: 'none',
  marginTop: '4em',
  padding: 'clamp(1em, 4vw, 4em)',
  borderRadius: '1em',
  color: 'white',
  textShadow: '1px 1px 2px #333',
  transition: 'all 0.25s',

  $nest: {
    '&:active': {
      transform: 'scale(1.05) !important',
      filter: 'brightness(0.85)',
    },

    '@media (hover: hover)': {
      $nest: {
        '&:hover': {
          transform: 'scale(1.025)',
        },
      },
    },
  },
});

export function Toggle(props) {
  const [code, setCode] = useState(localStorage.getItem(cryptKey));
  const [server, setServer] = useState(localStorage.getItem(serverKey));
  const [status, setStatus] = useState();

  useEffect(() => {
    if (!code) {
      const value = prompt('Please enter encryption key');
      if (value) {
        localStorage.setItem(cryptKey, value);
        setCode(value);
      } else window.location.reload();
    }
  }, [code, setCode]);

  useEffect(() => {
    if (!server) {
      const value = prompt('Please enter server address');
      if (value) {
        localStorage.setItem(serverKey, value);
        setServer(value);
      } else window.location.reload();
    }
  }, [server, setServer]);

  useEffect(() => {
    if (status !== undefined && status !== 'loading') setTimeout(() => setStatus(), 3000);
  }, [status]);

  return (
    <div>
      <button
        className={button}
        style={{ background: status === 'loading' ? '#8c8' : status === 'error' ? '#c55' : status === 'success' ? '#55c' : '#5a5' }}
        onClick={() => {
          const totpCode = totp(code);
          const url = `http://${server}/toggle?code=${totpCode}`;

          setStatus('loading');

          fetch(url, { method: 'POST' })
            .then((res) => res.text())
            .then((data) => {
              console.log(data);
              setStatus('success');
            })
            .catch((err) => {
              console.error(err);
              setStatus('error');
            });
        }}
      >
        <Icon />
      </button>

      <div style={{ color: 'white', textAlign: 'center', marginTop: '2em', fontSize: '2em', textTransform: 'capitalize' }}>
        {status}
        {!status && '\u00A0'}
      </div>
    </div>
  );
}

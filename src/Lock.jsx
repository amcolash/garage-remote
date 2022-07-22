import React, { useCallback, useEffect, useState } from 'react';
import { keyframes, style } from 'typestyle';
import { codeKey } from './const';

import clear from './icons/delete.svg';

const slot = style({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  fontSize: '2em',
  color: '#ccc',
  margin: '0.35em',
  padding: '0.5em',
  border: '3px solid #ccc',
  borderRadius: '0.25em',
  height: '1.5em',
  width: '1em',
});

const buttonAnimation = keyframes({
  '0%': { transform: 'scale(1)' },
  '100%': { transform: 'scale(1.2)', filter: 'brightness(1.5)' },
});

const button = style({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  flex: '1 1 calc(33.3% - 0.7em)',
  padding: '0.5em 0',
  margin: '0.35em',
  fontSize: '2.25em',
  background: '#2c2c2c',
  border: 'none',
  color: '#ccc',
  borderRadius: '0.25em',
  transition: 'all 0.25s',

  transform: 'scale(1)',
  filter: 'brightness(1)',

  $nest: {
    '&:active': {
      animation: buttonAnimation,
      animationDuration: '0.5s',
      animationIterationCount: 1,
      animationFillMode: 'forwards',
    },

    '@media (hover: hover)': {
      $nest: {
        '&:hover': {
          transform: 'scale(1.1)',
          filter: 'brightness(1.15)',
        },
      },
    },
  },
});

export function Lock(props) {
  const [code, setCode] = useState(localStorage.getItem(codeKey));
  const [value, setValue] = useState('');

  const handleKey = useCallback(
    (e) => {
      const num = Number.parseInt(e.key);
      if (Number.isInteger(num)) {
        setValue(value + num.toString());
      }
    },
    [value, setCode]
  );

  useEffect(() => {
    document.addEventListener('keyup', handleKey);
    return () => document.removeEventListener('keyup', handleKey);
  }, [handleKey]);

  useEffect(() => {
    if (!code) {
      const value = prompt('Please enter 4 digit code');
      if (value && value.length === 4 && isFinite(value)) {
        localStorage.setItem(codeKey, value);
        setCode(value);
        props.setLocked(false);
      } else window.location.reload();
    }
  }, [code, setCode]);

  useEffect(() => {
    setTimeout(() => {
      if (value.length === 4) {
        if (value === code) props.setLocked(false);
        else setValue('');
      }
    }, 250);
  }, [code, value]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '3em' }}>
        {value
          .padEnd(4, ' ')
          .split('')
          .map((v, i) => (
            <div key={i} className={slot}>
              <span style={{ transform: v !== ' ' ? 'scale(1)' : 'scale(0)', transition: 'all 0.1s' }}>⬤</span>
            </div>
          ))}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', maxWidth: '25em' }}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, '.', 0, '<'].map((c) => (
          <button
            className={button}
            style={c === '<' ? { padding: '0.25em 0' } : {}}
            key={c}
            data-value={c}
            onClick={(e) => {
              const v = e.currentTarget.getAttribute('data-value');

              if (v === '<') {
                if (value.length > 0) setValue(value.slice(0, -1));
              } else if (value.length < 4) setValue(value + v);
            }}
          >
            {c !== '<' ? c : <img src={clear} style={{ height: '1.35em' }} />}
          </button>
        ))}
      </div>
    </div>
  );
}

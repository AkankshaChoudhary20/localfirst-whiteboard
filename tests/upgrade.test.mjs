import {test} from 'node:test';
import assert from 'node:assert/strict';
import {upgradeRoom} from '../server/upgrade.mjs';

test('same-host and non-browser room upgrades are accepted', () => {
  assert.equal(upgradeRoom('/room/studio', 'http://localhost:1234', 'localhost:1234'), 'studio');
  assert.equal(upgradeRoom('/room/studio', undefined, 'localhost:1234'), 'studio');
});

test('malformed and foreign origins are safely rejected', () => {
  for (const origin of ['null', 'not a URL', 'http://[invalid', 'https://foreign.test']) {
    assert.equal(upgradeRoom('/room/studio', origin, 'localhost:1234'), null);
  }
});

test('invalid paths and malformed request URLs are rejected', () => {
  for (const path of ['/room/../escape', '/room/UPPERCASE', '/wrong/studio', 'http://[invalid']) {
    assert.equal(upgradeRoom(path, undefined, 'localhost:1234'), null);
  }
});

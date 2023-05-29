import { writable } from 'svelte/store';

export const csrf_token = writable('');
export const access_token = writable('');
export const logout_token = writable('');
export const host_entity = writable('');
export const storyline = writable('');
export const base_host = writable('');
import {env} from 'cloudflare:workers';
// Bump LEGAL_VERSION when the Termos/Privacidade text changes materially; signups record which version they accepted.
export const LEGAL_VERSION='2026-10-19';
export const LEGAL_DATE='19 de outubro de 2026';
export const COMPANY='GestorPec, CNPJ 64.269.893/0001-58';
export const supportEmail=()=>env.SUPPORT_EMAIL||env.EMPRESTO_ADMIN_EMAIL||'';

import { format, formatRelative, parse } from 'date-fns';
import { enIN } from 'date-fns/locale';

export const formatDate = (date, dateFormat = 'DD/MM/yyyy') => {
  try {
    return format(new Date(date), dateFormat || 'DD/MM/yyyy', { locale: enIN });
  } catch (error) {
    return '';
  }
};

export const formatTime = (date) => {
  try {
    return format(new Date(date), 'HH:mm:ss', { locale: enIN });
  } catch (error) {
    return '';
  }
};

export const formatDateTime = (date, dateTimeFormat = 'DD/MM/yyyy HH:mm:ss') => {
  try {
    return format(new Date(date), dateTimeFormat || 'DD/MM/yyyy HH:mm:ss', {
      locale: enIN,
    });
  } catch (error) {
    return '';
  }
};

export const formatRelativeTime = (date) => {
  try {
    return formatRelative(new Date(date), new Date(), { locale: enIN });
  } catch (error) {
    return '';
  }
};

export const formatShortDate = (date) => {
  try {
    return format(new Date(date), 'MMM dd, yyyy', { locale: enIN });
  } catch (error) {
    return '';
  }
};

export const getDayOfWeek = (date) => {
  try {
    return format(new Date(date), 'EEEE', { locale: enIN });
  } catch (error) {
    return '';
  }
};

export const getTimeDifference = (date1, date2) => {
  const diff = Math.abs(new Date(date1) - new Date(date2));
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / 1000 / 60) % 60),
  };
};

(function (global) {
  const getLocale = () => {
    const docLang = document.documentElement.lang;
    return docLang || navigator.language || 'en-GB';
  };

  const formatDateRange = (start, end) => {
    if (!start) return '';
    const startDate = new Date(start);
    const endDate = new Date(end || start);
    if (Number.isNaN(startDate.getTime())) return '';
    const locale = getLocale();
    const sameDay = start === end || startDate.toDateString() === endDate.toDateString();
    const monthFormatter = new Intl.DateTimeFormat(locale, { month: 'short' });
    const dayFormatter = new Intl.DateTimeFormat(locale, { day: 'numeric' });
    const yearFormatter = new Intl.DateTimeFormat(locale, { year: 'numeric' });
    const startMonth = monthFormatter.format(startDate);
    const startDay = dayFormatter.format(startDate);
    const startYear = yearFormatter.format(startDate);

    if (sameDay) {
      return `${startDay} ${startMonth} ${startYear}`;
    }

    const endMonth = monthFormatter.format(endDate);
    const endDay = dayFormatter.format(endDate);
    const endYear = yearFormatter.format(endDate);

    if (startYear === endYear && startMonth === endMonth) {
      return `${startDay}-${endDay} ${startMonth} ${startYear}`;
    }

    if (startYear === endYear) {
      return `${startDay} ${startMonth}-${endDay} ${endMonth} ${startYear}`;
    }

    return `${startDay} ${startMonth} ${startYear}-${endDay} ${endMonth} ${endYear}`;
  };

  const formatCurrency = (amount, currency) => {
    if (amount === null || amount === undefined || Number.isNaN(Number(amount))) return '';
    const locale = getLocale();
    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency || 'EUR',
        maximumFractionDigits: 0
      }).format(Number(amount));
    } catch (error) {
      return `${amount}`;
    }
  };

  const formatMonthYear = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat(getLocale(), { year: 'numeric', month: 'short' }).format(date);
  };

  global.FormatUtil = { formatDateRange, formatCurrency, formatMonthYear };
})(window);

(function (global) {
  const formatDateRange = (start, end) => {
    if (!start) return '';
    const startDate = new Date(start);
    const endDate = new Date(end || start);
    if (Number.isNaN(startDate.getTime())) return '';
    const sameDay = start === end || startDate.toDateString() === endDate.toDateString();
    const monthFormatter = new Intl.DateTimeFormat('en-GB', { month: 'short' });
    const dayFormatter = new Intl.DateTimeFormat('en-GB', { day: 'numeric' });
    const yearFormatter = new Intl.DateTimeFormat('en-GB', { year: 'numeric' });
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

  global.FormatUtil = { formatDateRange };
})(window);

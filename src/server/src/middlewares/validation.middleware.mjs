export const validateBookFilters = (req, res, next) => {
  const { startYear, endYear } = req.query;

  if (startYear && endYear) {
    const start = parseInt(startYear);
    const end = parseInt(endYear);

    if (!isNaN(start) && !isNaN(end) && start > end) {
      return res.status(400).json({
        error: 'Validation Error',
        details: 'startYear cannot be greater than endYear'
      });
    }
  }
  next();
};

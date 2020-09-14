const paginateResults = (data, pageNum) => {
    const page = parseInt(pageNum);
    const limit = 8;

    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    const results = {}

    if(endIndex < data.length) {
        results.next = {
            page: page + 1
        }
    }

    if(startIndex > 0) {
        results.previous = {
            page: page - 1
        }
    }

    results.results = data.slice(startIndex, endIndex);
    paginatedResults = results;
    return paginatedResults;
}

module.exports = paginateResults;
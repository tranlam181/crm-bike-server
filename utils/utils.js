var capitalizeFirstLetter = (string) => {
    return string.replace(/(^|\s)\S/g, l => l.toUpperCase());
}

module.exports = {
    capitalizeFirstLetter
}
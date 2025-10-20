window.clientLocalization = {
    getTimeZone() {
        const options = Intl.DateTimeFormat().resolvedOptions();
        return options.timeZone;
    }
}

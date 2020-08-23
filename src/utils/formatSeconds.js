const formatSeconds = (sec) => {
    let date = new Date(0);
    date.setSeconds(sec);
    return date.toISOString().substr(14, 5)
}
export default formatSeconds;
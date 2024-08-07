export const removeHttpPrefix = (link:string) => {
    const httpsPrefix = "https://";
    const httpPrefix = "http://";
    if (link.startsWith(httpsPrefix)) {
      // Remove the "https://" prefix from the string
      return link.slice(httpsPrefix.length);
    } else if (link.startsWith(httpPrefix)) {
      // Remove the "http://" prefix from the string
      return link.slice(httpPrefix.length);
    }
    
    // If the string doesn't start with "https://" or "http://", return it as is
    return link;
}
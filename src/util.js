export default {
    css: function (elem, obj) {
        for (var i in obj) {
            elem.style[i] = obj[i];
        }
    },
    hasClass: function (elem, classN) {
        var className = elem.getAttribute("class");
        return className.indexOf(classN) != -1;
    }
}
var entityMap = {
	"&": "&amp;",
	"<": "&lt;",
	">": "&gt;",
	'"': '&quot;',
	"'": '&#39;',
	"/": '&#x2F;'
};

function escapeHtml(string) {
	return String(string).replace(/[&<>"'\/]/g, function (s) {
		return entityMap[s];
	});
}

function compileTemplate(template, context){
	for (var key in context){
		var value = context[key];
		template = template.replace("<&- " + key + " &>", key === "image" ? value : escapeHtml(value));
	}
	return template;
}
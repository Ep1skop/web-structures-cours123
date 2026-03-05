from django import template

register = template.Library()

@register.simple_tag
def param_replace(request, **kwargs):
    d = request.GET.copy()
    for k, v in kwargs.items():
        d[k] = v
    return d.urlencode()

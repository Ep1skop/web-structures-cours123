from django.contrib import admin
from .models import Asset
# Удалите старую строку admin.site.register(Asset)
# Используем декоратор @admin.register
@admin.register(Asset)
class AssetAdmin(admin.ModelAdmin):
    # Какие поля показывать в таблице (колонки)
    list_display = ('title', 'created_at', 'id')
    # Добавляем строку поиска (поиск по названию)
    search_fields = ('title',) 
    # Добавляем фильтр справа (по дате)
    list_filter = ('created_at',)
    # Поля, на которые можно кликнуть для входа в редактирование
    list_display_links = ('title',)
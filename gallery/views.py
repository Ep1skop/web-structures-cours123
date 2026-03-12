import base64
from django.core.files.base import ContentFile
from django.shortcuts import render, redirect, get_object_or_404
from django.db.models import Q
from django.utils import timezone
from datetime import timedelta
from django.core.paginator import Paginator
from django.contrib import messages
from django.http import FileResponse
from .models import Asset
from .forms import AssetForm


def download_asset(request, asset_id):
    asset = get_object_or_404(Asset, id=asset_id)

    # увеличиваем счётчик
    asset.downloads += 1
    asset.save(update_fields=["downloads"])

    return FileResponse(asset.file.open("rb"), as_attachment=True)


def home(request):
    search_query = request.GET.get('q', '')
    ordering = request.GET.get('ordering', 'new')
    days = request.GET.get('days')

    assets = Asset.objects.all()

    # ПОИСК
    if search_query:
        assets = assets.filter(title__icontains=search_query)

    # ФИЛЬТР ПО ДАТЕ
    if days:
        try:
            days = int(days)
            assets = assets.filter(
                created_at__gte=timezone.now() - timedelta(days=days)
            )
        except ValueError:
            pass

    # СОРТИРОВКА
    if ordering == 'old':
        assets = assets.order_by('created_at')
    elif ordering == 'today':
        assets = assets.filter(
            created_at__gte=timezone.now() - timedelta(days=1)
        ).order_by('-created_at')
    else:
        assets = assets.order_by('-created_at')

    # ====== ПАГИНАЦИЯ ======
    paginator = Paginator(assets, 6)  # 8 моделей на страницу
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)

    context_data = {
        'page_title': 'Главная Галерея',
        'page_obj': page_obj,
    }

    return render(request, 'gallery/index.html', context_data)


def about(request):
    return render(request, 'gallery/about.html')


def upload(request):
    if request.method == 'POST':
        form = AssetForm(request.POST, request.FILES)
        if form.is_valid():
            new_asset = form.save(commit=False)

            image_data = request.POST.get('image_data')

            if image_data:
                format, imgstr = image_data.split(';base64,')
                ext = format.split('/')[-1]
                data = base64.b64decode(imgstr)
                file_name = f"{new_asset.title}_thumb.{ext}"
                new_asset.image.save(file_name, ContentFile(data), save=False)

            new_asset.save()

            

            return redirect('home')
    else:
        form = AssetForm()

    return render(request, 'gallery/upload.html', {'form': form})

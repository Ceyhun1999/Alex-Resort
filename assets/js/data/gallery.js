// Материалы галереи. Структура совместима с будущей выдачей из CMS:
// { type: 'image' | 'video', src, srcset?, poster?, caption }

const photo = (name, caption) => ({
  type: 'image',
  src: `assets/img/photos/${name}-1920.webp`,
  thumb: `assets/img/photos/${name}-640.webp`,
  caption,
});

export const GALLERY = [
  {
    type: 'video',
    src: 'assets/video/alex-resort-1280.mp4',
    poster: 'assets/img/photos/facade-render-1280.webp',
    caption: 'Видео о проекте: стройка, побережье Гагры, инфраструктура и шоурум',
  },
  photo('aerial-render', 'Визуализация комплекса с высоты: бассейны и благоустроенная территория'),
  photo('bedroom', 'Шоурум: спальня апартамента'),
  photo('coastline', 'Побережье Гагры с высоты'),
  photo('lounge', 'Визуализация лаундж-зоны'),
  photo('facade-render', 'Визуализация фасада комплекса со стороны пляжа'),
  photo('living', 'Шоурум: гостиная с панорамными окнами'),
  photo('kitchen', 'Шоурум: кухня-гостиная с видом на море'),
  photo('reception', 'Визуализация зоны ресепшен'),
  photo('construction', 'Здание комплекса: ход строительства'),
  photo('coast-aerial', 'Набережная и пляж рядом с комплексом'),
  photo('pool-indoor', 'Крытый бассейн с видом на море'),
  photo('pool-outdoor', 'Открытый бассейн среди пальм'),
  photo('promenade', 'Набережная Гагры'),
  photo('mountains', 'Горы Абхазии'),
];

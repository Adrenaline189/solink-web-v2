// components/SeoJsonLd.tsx
// Server Component (ไม่มี "use client")
// ใช้แปะ JSON-LD ลงใน <script type="application/ld+json"> อย่างปลอดภัย

type Props = {
  data: Record<string, any>;
};

export default function SeoJsonLd({ data }: Props) {
  if (!data) return null;

  // แปลงเป็นสตริงครั้งเดียว
  const json = JSON.stringify(data);

  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}

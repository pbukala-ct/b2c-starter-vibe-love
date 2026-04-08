import { getLocale } from '@/lib/session';
import { getPageSections } from '@/lib/layout';
import Grid from '@/components/grid/Grid';
import Cell from '@/components/grid/Cell';
import Item from '@/components/grid/Item';

export default async function HomePage() {
  const { locale, currency, country } = await getLocale();
  const [sections] = await Promise.all([getPageSections('home', locale, currency, country)]);

  return (
    <div>
      {sections.map((section, index) => {
        return (
          <Grid key={section.sectionId || index}>
            {section?.layoutElements?.map((layoutElement, layoutElementIndex) => (
              <Cell
                key={layoutElement.layoutElementId || layoutElementIndex}
                configuration={layoutElement.configuration}
              >
                {layoutElement.items.map((item, itemIndex) => {
                  return <Item key={item.layoutItemId || itemIndex} {...item} />;
                })}
              </Cell>
            ))}
          </Grid>
        );
      })}
    </div>
  );
}

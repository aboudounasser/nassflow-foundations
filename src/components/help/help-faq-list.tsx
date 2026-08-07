import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import type { HelpFaq } from "@/lib/help/types";

export function HelpFaqList({ items }: { items: HelpFaq[] }) {
  return (
    <Accordion type="single" collapsible className="w-full">
      {items.map((faq) => (
        <AccordionItem key={faq.id} value={faq.id} className="border-border">
          <AccordionTrigger className="gap-4 no-underline hover:no-underline">
            <span className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
              <span className="text-[14px] text-foreground">{faq.question}</span>
              <Badge variant="info">{faq.category}</Badge>
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <p className="max-w-[72ch] text-[14px] leading-6 text-muted-foreground">{faq.answer}</p>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

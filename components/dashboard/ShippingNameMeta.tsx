import { describeShippingNameStep, type FormatShippingNameResult } from "@/lib/formatShippingName";
import { cn } from "@/lib/utils";

type ShippingNameMetaProps = {
  result: FormatShippingNameResult;
  retailerLabel: string;
};

/** Live character count + "why" note under a generated {Name}-{Code}
 *  string, shared by the General address block and each retailer's Name
 *  field row so the shortening behavior is explained consistently
 *  wherever it shows up. */
export default function ShippingNameMeta({ result, retailerLabel }: ShippingNameMetaProps) {
  const note = describeShippingNameStep(result, retailerLabel);

  return (
    <div className="mt-1">
      <p className={cn("text-xs", result.overflows ? "font-semibold text-accent" : "text-fg/40")}>
        {result.charCount}/{result.maxLength} characters
      </p>
      {note && !result.overflows && <p className="mt-0.5 text-xs text-fg/50">{note}</p>}
      {result.overflows && (
        <p className="mt-1.5 rounded-lg border border-accent/30 bg-accent/5 px-3 py-2 text-xs text-accent-text">
          Even shortened, this doesn&rsquo;t fit {retailerLabel}&rsquo;s {result.maxLength}-character limit — your
          account code is still complete above, but please double-check this before using it. Contact us, or use a
          second address line if {retailerLabel} offers one.
        </p>
      )}
    </div>
  );
}

import { AbiParameter } from "viem";
import { InputWithLabel } from "@bera/ui/input";
import { useEffect, useState } from "react";
import { Button } from "@bera/ui/button";
import { Label } from "@bera/ui/label";
import { Switch } from "@bera/ui/switch";
import { FormError } from "@bera/ui/form-error";
import { ProposalErrorCodes } from "~/app/governance/types";

export function AbiInput({
  input,
  onChange,
  value,
  id,
  errors,
  label,
}: {
  input: AbiParameter;
  onChange: (v: any) => void;
  value: any;
  id: string;
  errors: any;
  label?: string;
}) {
  useEffect(() => {
    if ("components" in input && typeof value !== "object") {
      onChange({ [input.name!]: {} });
    }
    if (input.type === "string" && typeof value !== "string") {
      onChange("");
    }
  }, [value, input]);

  if ("components" in input) {
    if (input.type === "tuple") {
      if (typeof value !== "object") {
        return null;
      }
      return (
        <div className="grid grid-cols-1 gap-4">
          {label && <h3 className="">{label}</h3>}
          {input.components.map((component, idx) => (
            <AbiInput
              id={`${id}-${component.name}-${idx}`}
              key={`${id}-${component.name}-${idx}`}
              input={component}
              onChange={(v) => onChange({ ...value, [component.name!]: v })}
              value={value[component.name!]}
              errors={
                errors && typeof errors === "object"
                  ? errors[component.name!]
                  : errors
              }
            />
          ))}
          <FormError>{errors}</FormError>
        </div>
      );
    }

    return (
      <AbiTupleArrayInput
        input={input}
        onChange={onChange}
        value={value ?? ""}
        id={`${id}-${input.name}`}
        key={`${id}-${input.name}`}
        errors={errors}
      />
    );
  }

  const error =
    errors && typeof errors === "object" && input.name
      ? errors[input.name]
      : errors;
  if (input.type === "bool") {
    return (
      <div className="grid grid-cols-1 gap-2">
        <Label htmlFor={`${id}-${input.name}`}>Set {input.name}</Label>
        <div className="flex gap-2 items-center">
          <Switch
            id={`${id}-${input.name}`}
            checked={value}
            size={"sm"}
            onCheckedChange={(e) => {
              onChange(!!e);
            }}
          />
          {value ? (
            <label
              htmlFor={`${id}-${input.name}`}
              className="text-success-foreground"
            >
              True
            </label>
          ) : (
            <label htmlFor={`${id}-${input.name}`} className="">
              False
            </label>
          )}
        </div>
        <FormError>
          {error === ProposalErrorCodes.INVALID_AMOUNT
            ? "Please enter a valid boolean"
            : error}
        </FormError>
      </div>
    );
  }
  return (
    <InputWithLabel
      label={`Enter ${input.name}`}
      error={error}
      id={`${id}-${input.name}`}
      placeholder={input.type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

export function AbiTupleArrayInput({
  input,
  onChange,
  value,
  id,
  errors,
}: {
  input: AbiParameter;
  onChange: (v: any) => void;
  value: any;
  id: string;
  errors: any;
}) {
  const [values, setValues] = useState<any[]>(value);

  useEffect(() => {
    onChange(values);
  }, [values]);

  return (
    <div className="grid grid-cols-1 gap-4 pl-4">
      <h3 className="-ml-4">Enter {input.name}</h3>
      {Array.isArray(values)
        ? values.map((value, i) => (
            <div
              key={`${id}-${input.name}-${i}`}
              className="pb-6 border border-border rounded-md p-4"
            >
              <AbiInput
                label={`Enter ${input.name} ${i + 1}`}
                id={`${id}-${input.name}-${i}`}
                input={{ ...input, type: "tuple" }}
                onChange={(v) =>
                  setValues((prev) => {
                    const newValues = [...prev];
                    newValues[i] = v;
                    return newValues;
                  })
                }
                value={value}
                errors={Array.isArray(errors) ? errors[i] : errors}
              />
              <div className="flex justify-end">
                <Button
                  variant={"link"}
                  type="button"
                  onClick={() =>
                    setValues((prev) => prev.filter((_, idx) => idx !== i))
                  }
                  className="text-destructive-foreground px-0 text-sm block"
                >
                  Remove
                </Button>
              </div>
            </div>
          ))
        : null}

      <div className="flex flex-row gap-2">
        <Button onClick={() => setValues([...(values ?? []), {}])}>Add</Button>
      </div>
    </div>
  );
}

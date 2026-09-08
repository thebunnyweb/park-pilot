"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2, UserRound } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { apiSend, type TravellerRow, useTravellers } from "@/lib/hooks";
import {
  ageYears,
  type TravellerFormInput,
  type TravellerInput,
  travellerSchema,
} from "@/lib/validations";

export default function TravellersPage() {
  const { data, isLoading } = useTravellers();
  const [editing, setEditing] = useState<TravellerRow | null>(null);
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Travellers</h1>
          <p className="text-sm text-muted-foreground">
            Ages and heights drive ride eligibility and pacing in every plan.
          </p>
        </div>
        <Dialog
          open={open}
          onOpenChange={(v) => {
            setOpen(v);
            if (!v) setEditing(null);
          }}
        >
          <DialogTrigger asChild>
            <Button className="gap-1.5">
              <Plus className="h-4 w-4" /> Add traveller
            </Button>
          </DialogTrigger>
          <TravellerDialog
            key={editing?.id ?? "new"}
            editing={editing}
            onDone={() => {
              setOpen(false);
              setEditing(null);
            }}
          />
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : data?.travellers.length ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {data.travellers.map((t) => (
            <Card key={t.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <UserRound className="h-4 w-4 text-muted-foreground" />
                  {t.name}
                </CardTitle>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setEditing(t);
                      setOpen(true);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <DeleteButton id={t.id} />
                </div>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <p>
                  Age {ageYears(t.birthdate)} ·{" "}
                  {t.heightInInches ? `${t.heightInInches}" tall` : "height not set"}
                </p>
                <p className="capitalize">Thrill tolerance: {t.thrillTolerance}</p>
                {t.needsMiddayBreak && <p>Needs a midday break</p>}
                {t.mobilityNotes && <p>Note: {t.mobilityNotes}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed py-16 text-center text-sm text-muted-foreground">
          No travellers yet. Add everyone in your party to get a tailored plan.
        </div>
      )}
    </div>
  );
}

function DeleteButton({ id }: { id: string }) {
  const qc = useQueryClient();
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={async () => {
        try {
          await apiSend(`/api/travellers/${id}`, "DELETE");
          qc.invalidateQueries({ queryKey: ["travellers"] });
          toast.success("Traveller removed");
        } catch (e) {
          toast.error(e instanceof Error ? e.message : "Failed");
        }
      }}
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}

function TravellerDialog({
  editing,
  onDone,
}: {
  editing: TravellerRow | null;
  onDone: () => void;
}) {
  const qc = useQueryClient();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<TravellerFormInput, unknown, TravellerInput>({
    resolver: zodResolver(travellerSchema),
    defaultValues: editing
      ? {
          name: editing.name,
          birthdate: editing.birthdate.slice(0, 10),
          heightInInches: editing.heightInInches ?? undefined,
          thrillTolerance: editing.thrillTolerance,
          needsMiddayBreak: editing.needsMiddayBreak,
          mobilityNotes: editing.mobilityNotes ?? "",
        }
      : { thrillTolerance: "medium", needsMiddayBreak: false },
  });

  async function onSubmit(values: TravellerInput) {
    try {
      if (editing) {
        await apiSend(`/api/travellers/${editing.id}`, "PATCH", values);
      } else {
        await apiSend("/api/travellers", "POST", values);
      }
      qc.invalidateQueries({ queryKey: ["travellers"] });
      toast.success(editing ? "Traveller updated" : "Traveller added");
      onDone();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{editing ? "Edit traveller" : "Add traveller"}</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">Name</Label>
          <Input id="name" {...register("name")} />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="birthdate">Birth date</Label>
            <Input id="birthdate" type="date" {...register("birthdate")} />
            {errors.birthdate && (
              <p className="text-xs text-destructive">{errors.birthdate.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="height">Height (inches)</Label>
            <Input
              id="height"
              type="number"
              placeholder="optional"
              {...register("heightInInches")}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Thrill tolerance</Label>
          <Select
            value={watch("thrillTolerance") ?? "medium"}
            onValueChange={(v) =>
              setValue("thrillTolerance", v as TravellerInput["thrillTolerance"])
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low — avoids drops, spins, dark rides</SelectItem>
              <SelectItem value="medium">Medium — family rides, mild coasters</SelectItem>
              <SelectItem value="high">High — rides everything</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={Boolean(watch("needsMiddayBreak"))}
            onCheckedChange={(v) => setValue("needsMiddayBreak", Boolean(v))}
          />
          Needs a midday break / nap
        </label>
        <div className="space-y-1.5">
          <Label htmlFor="mob">Mobility or other notes</Label>
          <Input id="mob" placeholder="optional" {...register("mobilityNotes")} />
        </div>
        <DialogFooter>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

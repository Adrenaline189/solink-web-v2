import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PlayCircle, StopCircle } from "lucide-react";

type Props = {
  active: boolean;
  loading?: boolean;
  onToggle: (next: boolean) => void;
};

export default function SharingCard({ active, loading, onToggle }: Props) {
  return (
    <Card>
      <CardContent className="p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-semibold">Sharing</div>
            <div className="text-sm opacity-70">
              {active ? "Sharing is active" : "Sharing is paused"}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* START */}
            <Button
              variant={active ? "secondary" : "outline"}
              disabled={loading || active}
              onClick={() => onToggle(true)}
            >
              <PlayCircle className="h-4 w-4 mr-2" />
              Start
            </Button>

            {/* STOP */}
            <Button
              variant={!active ? "secondary" : "outline"}
              disabled={loading || !active}
              onClick={() => onToggle(false)}
            >
              <StopCircle className="h-4 w-4 mr-2" />
              Stop
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

import inspect
import sys
import types
from collections.abc import Iterator

from ..async_event import AsyncBroker
from .phase import Phase
from .phasemanager import PhaseManager
from .loggable import Loggable

# Role of AuthoringManager:
# 1. Load script
# 2. Manage the current phase and next intervention
# 3. Provide the next phase based on the script


class AuthoringManager:
    def __init__(self, phase_manager: PhaseManager, script):
        self.phase_manager = phase_manager
        self.intervention_iter = None
        self.goodbye = False  # Flag of starting a Goodbye phase
        if script:
            self._load_script(script)

    def _load_script(self, script) -> str:
        if inspect.isgeneratorfunction(script):
            self.intervention_iter = script()
            return "Authored script function loaded and prepared."
        else:
            self.intervention_iter = None
            return "Provided script is not a generator function."

    def get_next_intervention(self) -> Phase | None:
        """
        Get the next intervention from the script.
        Returns a phase with the intervention data.
        """
        if self.intervention_iter is None:
            print("No script loaded. Returning None.")
            return None

        if self.goodbye:
            print("Goodby phase ended. Finishing the conversation.")
            self.goodbye = False
            return self.phase_manager.getPhase("FINISH")

        try:
            phase_name = next(self.intervention_iter)
            print(f"Next intervention: {phase_name}")

            next_phase = self.phase_manager.getPhase(phase_name)
            if next_phase:
                return next_phase
            else:
                return f"Error: Phase '{phase_name}' not found in PhaseManager."
        except StopIteration:
            print("No more interventions in the script.")
            self.goodbye = True
            return self.phase_manager.getPhase(
                "Goodbye"
            )  # After script ends, return Goodbye phase

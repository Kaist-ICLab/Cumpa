### This file is an example of authored script for a micro intervention flow.
# Later the code will be sent from blockly authoring tool


# Example Micro Intervention Set named "Stay Present"
def stay_present(emotion):
    yield "notice_five_things"
    if emotion() == "negative":
        yield "hands_as_thoughts"
        if emotion() == "negative":
            yield "five_senses"


# Main function of the script
def script(emotion):
    print("[Script] Starting the script with emotion analysis.")
    if emotion() == "negative":
        yield from stay_present(emotion)
    yield "dandelion"

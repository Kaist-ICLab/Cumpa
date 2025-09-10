### Auto-generated authored script
def Stay_Present(emotion):
    yield 'five_senses'
    if emotion() == 'negative':
        yield 'notice_five_things'


def script(emotion):
    print('[Script] Starting the script with emotion analysis.')
    yield 'five_senses'
    if emotion() == 'negative':
        yield from Stay_Present(emotion)
    else:
        yield 'dandelion'
